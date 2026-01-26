"""Scripts 전용 서비스 모듈.

이 모듈은 데이터 파이프라인 스크립트에서만 사용됩니다.
서버 앱(app/)에서는 절대 import하지 않습니다.

주요 서비스:
- LocalEmbeddingService: BGE-M3 기반 로컬 임베딩 생성
"""
