"""로컬 BGE-M3 임베딩 서비스.

이 서비스는 데이터 파이프라인 스크립트에서만 사용됩니다.
서버 앱(app/)에서는 절대 import하지 않습니다.

BGE-M3 모델은 lazy loading으로 필요할 때만 로드됩니다.
이를 통해 서버 환경에서 불필요한 메모리 사용을 방지합니다.

요구사항:
    pip install FlagEmbedding torch
    또는
    uv sync --extra local
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class LocalEmbeddingService:
    """BGE-M3 기반 로컬 임베딩 서비스.

    EmbeddingServiceProtocol을 구현합니다.
    모델은 첫 임베딩 생성 시 lazy loading됩니다.

    Attributes:
        model_name: BGE-M3 모델 이름.
        use_fp16: FP16 사용 여부 (GPU 메모리 절약).
        batch_size: 배치 처리 크기.
        _model: FlagModel 인스턴스 (lazy loaded).
    """

    def __init__(
        self,
        model_name: str = "BAAI/bge-m3",
        use_fp16: bool = True,
        batch_size: int = 32,
    ):
        """로컬 임베딩 서비스를 초기화합니다.

        Args:
            model_name: 사용할 모델 이름 (기본: BAAI/bge-m3).
            use_fp16: FP16 사용 여부 (기본: True).
            batch_size: 배치 처리 크기 (기본: 32).
        """
        self.model_name = model_name
        self.use_fp16 = use_fp16
        self.batch_size = batch_size
        self._model: Optional[object] = None
        self._dimensions = 1024  # BGE-M3 기본 차원

    @property
    def dimensions(self) -> int:
        """임베딩 벡터의 차원 수를 반환합니다.

        Returns:
            임베딩 차원 수 (1024).
        """
        return self._dimensions

    def _get_model(self):
        """BGE-M3 모델을 lazy loading합니다.

        Returns:
            FlagModel 인스턴스.

        Raises:
            ImportError: FlagEmbedding 패키지가 설치되지 않은 경우.
        """
        if self._model is None:
            try:
                from FlagEmbedding import BGEM3FlagModel
            except ImportError as e:
                raise ImportError(
                    "FlagEmbedding 패키지가 필요합니다. "
                    "'uv sync --extra local' 또는 "
                    "'pip install FlagEmbedding torch'로 설치하세요."
                ) from e

            logger.info(f"BGE-M3 모델 로딩 중: {self.model_name}")
            self._model = BGEM3FlagModel(
                self.model_name,
                use_fp16=self.use_fp16,
            )
            logger.info("BGE-M3 모델 로딩 완료")

        return self._model

    def create_embedding(self, text: str) -> list[float]:
        """단일 텍스트의 임베딩을 생성합니다.

        Args:
            text: 임베딩할 텍스트.

        Returns:
            임베딩 벡터 (1024차원).
        """
        # 빈 텍스트 처리
        if not text or not text.strip():
            text = " "

        model = self._get_model()
        result = model.encode(
            [text],
            batch_size=1,
            max_length=8192,
        )

        # BGE-M3는 dense_vecs를 반환
        embedding = result["dense_vecs"][0]

        # numpy array를 list로 변환
        if hasattr(embedding, "tolist"):
            return embedding.tolist()
        return list(embedding)

    def create_embeddings_batch(self, texts: list[str]) -> list[list[float]]:
        """여러 텍스트의 임베딩을 배치로 생성합니다.

        Args:
            texts: 임베딩할 텍스트 목록.

        Returns:
            각 텍스트에 대한 임베딩 벡터 목록.
        """
        if not texts:
            return []

        # 빈 텍스트 처리
        processed_texts = [t if t and t.strip() else " " for t in texts]

        model = self._get_model()
        result = model.encode(
            processed_texts,
            batch_size=self.batch_size,
            max_length=8192,
        )

        embeddings = result["dense_vecs"]

        # numpy array를 list로 변환
        output = []
        for emb in embeddings:
            if hasattr(emb, "tolist"):
                output.append(emb.tolist())
            else:
                output.append(list(emb))

        return output
