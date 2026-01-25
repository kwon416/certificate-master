"""자격증 API 엔드포인트.

자격증의 검색, 조회, 업데이트 기능을 제공합니다.
MariaDB (SQLAlchemy)로 마이그레이션됨.
"""
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.dialects.mysql import JSON

from app.api.deps import DBSession
from app.models.certificate import Certificate as CertificateModel
from app.schemas.certificate import (
    AutocompleteResult,
    CategoryInfo,
    Certificate,
    CertificateList,
    CertificateUpdate,
    SeriesByCategory,
)

router = APIRouter()


@router.get("/search", response_model=CertificateList)
async def search_certificates(
    db: DBSession,
    q: Optional[str] = Query(None, description="검색 키워드"),
    category: Optional[str] = Query(None, description="자격구분명 필터 (deprecated, categories 사용 권장)"),
    categories: Optional[list[str]] = Query(None, description="자격구분명 필터 (여러 개 가능)"),
    series: Optional[str] = Query(None, description="계열명 필터"),
    code: Optional[str] = Query(None, description="자격구분코드 필터"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지 크기"),
):
    """자격증 검색 (필터링 지원).

    키워드, 카테고리, 계열, 코드로 필터링하여 자격증을 검색합니다.

    Args:
        q: 검색 키워드 (제목, 계열명에서 검색)
        category: 자격구분명 필터 (예: 국가전문자격) - deprecated
        categories: 자격구분명 필터 목록 (예: ["국가기술자격", "과정평가형자격"])
        series: 계열명 필터 (예: 정보기술)
        code: 자격구분코드 필터 (예: S, T, Q)
        page: 페이지 번호 (기본 1)
        page_size: 페이지 크기 (기본 20)

    Returns:
        CertificateList: 검색 결과 목록 및 페이지 정보.
    """
    from sqlalchemy import func, text

    # Build query
    query = db.query(CertificateModel)

    # Apply filters
    if q:
        # Search in title and series using LIKE
        query = query.filter(
            or_(
                CertificateModel.title.like(f"%{q}%"),
                CertificateModel.series.like(f"%{q}%"),
            )
        )

    # 카테고리 필터링 (categories JSON 배열에서 검색)
    if categories:
        # 여러 카테고리 중 하나라도 포함되면 매칭 (OR 조건)
        category_conditions = []
        for cat_name in categories:
            # JSON_CONTAINS로 categories 배열에서 name 필드 검색
            category_conditions.append(
                func.json_contains(
                    CertificateModel.categories,
                    func.json_quote(cat_name),
                    text("'$[*].name'")
                )
            )
        if category_conditions:
            query = query.filter(or_(*category_conditions))
    elif category:
        # 기존 category 필드로 필터링 (하위 호환성)
        # 또는 categories JSON에서 검색
        query = query.filter(
            or_(
                CertificateModel.category == category,
                func.json_contains(
                    CertificateModel.categories,
                    func.json_quote(category),
                    text("'$[*].name'")
                )
            )
        )

    if series:
        query = query.filter(CertificateModel.series == series)

    if code:
        query = query.filter(CertificateModel.code == code)

    # Get total count
    total = query.count()

    # Pagination
    offset = (page - 1) * page_size
    query = query.order_by(CertificateModel.title)
    query = query.offset(offset).limit(page_size)

    # Execute query
    results = query.all()

    items = [Certificate.model_validate(item.to_dict()) for item in results]

    return CertificateList(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        has_more=(offset + len(items)) < total,
    )


@router.get("/autocomplete", response_model=list[AutocompleteResult])
async def autocomplete_certificates(
    db: DBSession,
    q: str = Query(..., min_length=1, description="자동완성 검색어"),
    limit: int = Query(10, ge=1, le=20, description="결과 개수"),
):
    """자격증 제목 자동완성.

    검색어에 매칭되는 자격증 제목 목록을 반환합니다.

    Args:
        q: 검색어 (최소 1글자)
        limit: 최대 결과 개수 (기본 10개)

    Returns:
        list[AutocompleteResult]: 매칭되는 자격증 목록 (제목, 카테고리, 계열 포함).
    """
    # Search in title and series
    query = (
        db.query(CertificateModel)
        .filter(
            or_(
                CertificateModel.title.like(f"%{q}%"),
                CertificateModel.series.like(f"%{q}%"),
            )
        )
        .order_by(CertificateModel.title)
        .limit(limit)
    )

    results = query.all()

    # Format for autocomplete
    return [
        AutocompleteResult(
            id=item.id,
            title=item.title,
            category=item.category,
            categories=[CategoryInfo(**cat) for cat in (item.categories or [])],
            series=item.series,
        )
        for item in results
    ]


@router.get("/categories", response_model=list[str])
async def get_categories(db: DBSession):
    """모든 자격증 카테고리 조회.

    데이터베이스에 있는 고유한 자격증 카테고리 목록을 반환합니다.

    Returns:
        list[str]: 카테고리명 목록 (정렬됨).
    """
    results = db.query(CertificateModel.category).distinct().all()

    # Extract unique categories
    categories = sorted(item[0] for item in results)
    return categories


@router.get("/series", response_model=list[SeriesByCategory])
async def get_series_by_category(
    db: DBSession,
    category: Optional[str] = Query(None, description="카테고리 필터"),
):
    """자격증 계열 목록 조회 (카테고리별 필터링 지원).

    자격증 계열 목록을 카테고리별로 그룹화하여 반환합니다.

    Args:
        category: 카테고리 필터 (선택사항)

    Returns:
        list[SeriesByCategory]: 카테고리별 계열 목록.
    """
    query = db.query(CertificateModel.category, CertificateModel.series)

    if category:
        query = query.filter(CertificateModel.category == category)

    results = query.all()

    # Group series by category
    series_map: dict[str, set] = {}
    for cat, ser in results:
        if ser:
            if cat not in series_map:
                series_map[cat] = set()
            series_map[cat].add(ser)

    # Format result
    result = []
    for cat, series_set in sorted(series_map.items()):
        result.append(SeriesByCategory(category=cat, series=sorted(list(series_set))))

    return result


@router.get("/{certificate_id}", response_model=Certificate)
async def get_certificate(
    certificate_id: str,
    db: DBSession,
):
    """자격증 상세 정보 조회 (ID).

    UUID로 특정 자격증의 상세 정보를 조회합니다.

    Args:
        certificate_id: 자격증 UUID

    Returns:
        Certificate: 자격증 상세 정보 (모든 강화 데이터 포함).

    Raises:
        HTTPException: 404 - 자격증을 찾을 수 없음.
    """
    cert = (
        db.query(CertificateModel)
        .filter(CertificateModel.id == certificate_id)
        .first()
    )

    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Certificate with id {certificate_id} not found",
        )

    return Certificate.model_validate(cert.to_dict())


@router.get("/raw/{raw_id}", response_model=Certificate)
async def get_certificate_by_raw_id(
    raw_id: str,
    db: DBSession,
):
    """자격증 조회 (raw_id).

    raw_id로 자격증을 조회합니다.

    Args:
        raw_id: 자격증 raw_id (예: S_세무사, T_정보처리기사)

    Returns:
        Certificate: 자격증 상세 정보.

    Raises:
        HTTPException: 404 - 자격증을 찾을 수 없음.
    """
    cert = db.query(CertificateModel).filter(CertificateModel.raw_id == raw_id).first()

    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Certificate with raw_id {raw_id} not found",
        )

    return Certificate.model_validate(cert.to_dict())


@router.patch("/{certificate_id}", response_model=Certificate)
async def update_certificate(
    certificate_id: str,
    update_data: CertificateUpdate,
    db: DBSession,
):
    """자격증 정보 업데이트 (관리자/서비스 전용).

    자격증 정보를 업데이트합니다. LLM 강화 데이터 업데이트 등에 사용됩니다.

    Args:
        certificate_id: 자격증 UUID
        update_data: 업데이트할 필드

    Returns:
        Certificate: 업데이트된 자격증 정보.

    Raises:
        HTTPException: 400 - 업데이트할 필드 없음, 404 - 자격증을 찾을 수 없음.
    """
    # Filter out None values
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}

    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    # Find certificate
    cert = (
        db.query(CertificateModel)
        .filter(CertificateModel.id == certificate_id)
        .first()
    )

    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Certificate with id {certificate_id} not found",
        )

    # Update fields
    for key, value in update_dict.items():
        setattr(cert, key, value)

    db.commit()
    db.refresh(cert)

    return Certificate.model_validate(cert.to_dict())
