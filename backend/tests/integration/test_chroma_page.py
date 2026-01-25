"""Integration test for the Chroma inspection page."""
from fastapi.testclient import TestClient

from app.main import app
from app.api.chroma import get_vector_store_service


class FakeVectorStoreService:
    """Fake vector store for rendering tests."""

    def __init__(self):
        self.list_kwargs = None
        self.requested_ids = []

    def get_collection_stats(self) -> dict:
        return {
            "host": "fake-host",
            "port": 1234,
            "collection_name": "test-collection",
            "total_vectors": 2,
        }

    def list_vectors(self, limit: int, offset: int, include_embeddings: bool = False):
        self.list_kwargs = {
            "limit": limit,
            "offset": offset,
            "include_embeddings": include_embeddings,
        }
        return [
            {"id": "vec-1", "metadata": {"title": "정보처리기사", "category": "국가기술자격"}},
            {"id": "vec-2", "metadata": {"title": "네트워크보안", "category": "민간자격"}},
        ]

    def get_by_id(self, vector_id: str):
        self.requested_ids.append(vector_id)
        if vector_id == "vec-1":
            return {
                "id": "vec-1",
                "values": [0.1, 0.2],
                "metadata": {"title": "정보처리기사", "category": "국가기술자격"},
            }
        if vector_id == "vec-2":
            return {
                "id": "vec-2",
                "values": [0.3, 0.4],
                "metadata": {"title": "네트워크보안", "category": "민간자격"},
            }
        return None


def test_chroma_page_renders_vectors_and_details(client: TestClient):
    """The /chroma page should show list data and detail panel."""
    fake_service = FakeVectorStoreService()
    app.dependency_overrides[get_vector_store_service] = lambda: fake_service

    try:
        response = client.get("/chroma?limit=5&offset=10&id=vec-2")
    finally:
        app.dependency_overrides.pop(get_vector_store_service, None)

    assert response.status_code == 200
    body = response.text

    assert "Chroma Collection" in body
    assert "vec-1" in body
    assert "정보처리기사" in body
    assert "vec-2" in body
    assert "네트워크보안" in body
    assert fake_service.list_kwargs == {
        "limit": 5,
        "offset": 10,
        "include_embeddings": False,
    }
    assert fake_service.requested_ids[0] == "vec-2"
