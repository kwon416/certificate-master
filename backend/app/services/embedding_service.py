"""자격증 텍스트 포맷팅 및 BGE-M3 임베딩 생성 서비스.

이 서비스는:
1. 자격증 데이터를 임베딩용 텍스트로 포맷합니다.
2. BGE-M3 모델을 사용하여 로컬에서 임베딩을 생성합니다.

BGE-M3: 다국어 지원, 1024차원 임베딩, FP16 지원
"""
import os
import warnings
from typing import Optional

# 토크나이저 경고 억제 (모듈 import 전에 설정)
os.environ["TOKENIZERS_PARALLELISM"] = "false"
warnings.filterwarnings("ignore", message=".*XLMRobertaTokenizerFast.*")
warnings.filterwarnings("ignore", category=UserWarning, module="transformers")

from FlagEmbedding import BGEM3FlagModel

from app.core.config import get_settings
from app.utils.certificate_formatter import format_certificate_text


class EmbeddingService:
    """자격증 데이터 포맷팅 및 BGE-M3 임베딩 생성 서비스.

    Attributes:
        _model: BGE-M3 모델 인스턴스 (싱글톤).
    """

    _model: Optional[BGEM3FlagModel] = None  # 클래스 레벨 싱글톤

    def __init__(self, api_key: Optional[str] = None):
        """서비스를 초기화합니다.

        Args:
            api_key: 더 이상 사용되지 않음 (하위 호환성 유지).
        """
        # 하위 호환성을 위해 유지, 실제로 사용되지 않음
        self.api_key = api_key

    @classmethod
    def _get_model(cls) -> BGEM3FlagModel:
        """BGE-M3 모델을 싱글톤으로 로드합니다.

        Returns:
            BGEM3FlagModel 인스턴스.
        """
        if cls._model is None:
            settings = get_settings()
            cls._model = BGEM3FlagModel(
                model_name_or_path=settings.BGE_M3_MODEL_NAME,
                use_fp16=settings.BGE_M3_USE_FP16,
            )
        return cls._model

    def create_embedding(self, text: str) -> list[float]:
        """단일 텍스트의 임베딩을 생성합니다.

        Args:
            text: 임베딩할 텍스트.

        Returns:
            1024차원 임베딩 벡터.
        """
        model = self._get_model()
        result = model.encode([text])
        vec = result["dense_vecs"][0]
        # numpy array인 경우 tolist() 호출, 이미 list면 그대로 반환
        return vec.tolist() if hasattr(vec, "tolist") else vec

    def create_embeddings_batch(self, texts: list[str]) -> list[list[float]]:
        """여러 텍스트의 임베딩을 배치로 생성합니다.

        Args:
            texts: 임베딩할 텍스트 목록.

        Returns:
            각 텍스트에 대한 1024차원 임베딩 벡터 목록.
        """
        if not texts:
            return []

        settings = get_settings()
        model = self._get_model()

        # 배치 크기로 나누어 처리
        all_embeddings = []
        batch_size = settings.BGE_M3_BATCH_SIZE

        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            result = model.encode(batch)
            # numpy array인 경우 tolist() 호출, 이미 list면 그대로 사용
            embeddings = [
                vec.tolist() if hasattr(vec, "tolist") else vec
                for vec in result["dense_vecs"]
            ]
            all_embeddings.extend(embeddings)

        return all_embeddings

    def format_certificate_for_embedding(self, cert: dict) -> str:
        """임베딩 생성을 위해 자격증 데이터를 포맷합니다.

        B4 수정: 공통 유틸리티 함수 사용으로 중복 제거.

        Args:
            cert: 자격증 데이터를 담은 딕셔너리.

        Returns:
            임베딩용으로 포맷된 텍스트 문자열.
        """
        return format_certificate_text(cert)
