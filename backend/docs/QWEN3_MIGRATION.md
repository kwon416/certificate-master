# Qwen3 마이그레이션 가이드

**마이그레이션 일자**: 2026-01-23
**이전 버전**: OpenAI GPT-4o / GPT-4o-mini
**현재 버전**: Qwen3-235B-A22B-Thinking-2507

---

## 1. 개요

Certificate Master 백엔드의 LLM 서비스를 OpenAI에서 Qwen3로 마이그레이션했습니다.
SGLang/vLLM의 OpenAI-compatible API를 사용하여 기존 코드를 최소한으로 수정했습니다.

---

## 2. 변경된 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/core/config.py` | QWEN3_* 환경변수 추가 |
| `app/services/llm_service.py` | Qwen3 설정 사용 |
| `app/services/study_plan_service.py` | Qwen3 설정 사용 |
| `.env.example` | Qwen3 설정 예시 추가 |
| `tests/unit/test_study_plan_service.py` | Qwen3에 맞게 테스트 업데이트 |

---

## 3. 새로운 환경변수

```env
# Qwen3 Configuration
QWEN3_API_URL=http://localhost:8000/v1
QWEN3_MODEL_NAME=Qwen3-235B-A22B-Thinking-2507
QWEN3_API_KEY=EMPTY
```

---

## 4. Qwen3 서버 실행

### SGLang (권장)

```bash
python -m sglang.launch_server \
    --model-path Qwen/Qwen3-235B-A22B-Thinking-2507-FP8 \
    --tp 4 \
    --context-length 262144 \
    --reasoning-parser deepseek-r1
```

### vLLM

```bash
vllm serve Qwen/Qwen3-235B-A22B-Thinking-2507-FP8 \
    --tensor-parallel-size 4 \
    --max-model-len 262144 \
    --enable-reasoning \
    --reasoning-parser deepseek_r1
```

---

## 5. Best Practices (Qwen3)

### Sampling Parameters

- Temperature: 0.6
- TopP: 0.95
- TopK: 20
- MinP: 0

### Output Length

- 일반 쿼리: 32,768 토큰
- 복잡한 문제 (수학, 프로그래밍): 81,920 토큰

### Prompt 표준화

- 수학 문제: "Please reason step by step, and put your final answer within \boxed{}."
- 객관식: "Please show your choice in the answer field with only the choice letter."

---

## 6. 테스트 결과

```
tests/unit/test_qwen3_migration.py: 8 passed
tests/unit/test_study_plan_service.py: 7 passed
tests/unit/test_llm_service.py: 3 passed
```

---

## 7. 롤백 방법

성능 저하 또는 오류 발생 시 롤백:

1. **백업 문서 참조**: `docs/OPENAI_BACKUP.md`

2. **Git 롤백**:
   ```bash
   git checkout -- app/services/llm_service.py
   git checkout -- app/services/study_plan_service.py
   git checkout -- app/core/config.py
   ```

3. **환경변수 복원**:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

---

## 8. 모니터링

마이그레이션 후 1주일간 다음 지표를 모니터링:

- 응답 시간
- JSON 출력 정확도
- 에러 발생률
- 사용자 피드백

---

## 9. 알려진 제한사항

1. **Context Length**: 262,144 토큰 (OOM 시 131,072로 축소)
2. **GPU 요구사항**: 4x GPU (tensor-parallel-size 4)
3. **Thinking Content**: `--reasoning-parser` 옵션으로 자동 처리

---

## 10. 참고 자료

- [Qwen3 Technical Report](https://arxiv.org/abs/2505.09388)
- [SGLang Documentation](https://github.com/sgl-project/sglang)
- [vLLM Documentation](https://github.com/vllm-project/vllm)

---

**작성자**: Claude
**문서 버전**: 1.0
