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

    def list_vectors(self, limit: int, offset: int, include_embeddings: bool = False, where: dict = None):
        self.list_kwargs = {
            "limit": limit,
            "offset": offset,
            "include_embeddings": include_embeddings,
            "where": where,
        }
        return [
            {"id": "vec-1", "metadata": {"title": "정보처리기사", "categories": "국가기술자격"}},
            {"id": "vec-2", "metadata": {"title": "네트워크보안", "categories": "민간자격"}},
        ]

    def get_by_id(self, vector_id: str):
        self.requested_ids.append(vector_id)
        if vector_id == "vec-1":
            return {
                "id": "vec-1",
                "values": [0.1, 0.2],
                "metadata": {"title": "정보처리기사", "categories": "국가기술자격"},
            }
        if vector_id == "vec-2":
            return {
                "id": "vec-2",
                "values": [0.3, 0.4],
                "metadata": {"title": "네트워크보안", "categories": "민간자격"},
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

    assert "ChromaDB Inspector" in body
    assert "vec-1" in body
    assert "정보처리기사" in body
    assert "vec-2" in body
    assert "네트워크보안" in body
    assert fake_service.list_kwargs == {
        "limit": 5,
        "offset": 10,
        "include_embeddings": False,
        "where": None,
    }
    assert fake_service.requested_ids[0] == "vec-2"


def test_chroma_delete_single_vector(client: TestClient):
    """DELETE /chroma/{id} should delete a single vector."""
    fake_service = FakeVectorStoreService()
    fake_service.deleted_ids = []

    def delete_certificate(cert_id: str):
        fake_service.deleted_ids.append(cert_id)

    fake_service.delete_certificate = delete_certificate

    app.dependency_overrides[get_vector_store_service] = lambda: fake_service

    try:
        response = client.delete("/chroma/vec-1")
    finally:
        app.dependency_overrides.pop(get_vector_store_service, None)

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["deleted_id"] == "vec-1"
    assert "vec-1" in fake_service.deleted_ids


def test_chroma_delete_batch_vectors(client: TestClient):
    """POST /chroma/delete should delete multiple vectors."""
    fake_service = FakeVectorStoreService()
    fake_service.deleted_ids = []

    def delete_certificates_batch(cert_ids: list[str]):
        fake_service.deleted_ids.extend(cert_ids)

    fake_service.delete_certificates_batch = delete_certificates_batch

    app.dependency_overrides[get_vector_store_service] = lambda: fake_service

    try:
        response = client.post(
            "/chroma/delete",
            json={"ids": ["vec-1", "vec-2"]}
        )
    finally:
        app.dependency_overrides.pop(get_vector_store_service, None)

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["deleted_count"] == 2
    assert "vec-1" in fake_service.deleted_ids
    assert "vec-2" in fake_service.deleted_ids


def test_chroma_page_has_delete_button(client: TestClient):
    """The /chroma page should have delete button when vector is selected."""
    fake_service = FakeVectorStoreService()
    app.dependency_overrides[get_vector_store_service] = lambda: fake_service

    try:
        response = client.get("/chroma?id=vec-1")
    finally:
        app.dependency_overrides.pop(get_vector_store_service, None)

    assert response.status_code == 200
    body = response.text
    assert "delete-btn" in body or "삭제" in body or "Delete" in body
