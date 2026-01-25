'use client'

import { useMemo } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

type MoodType = 'great' | 'good' | 'okay' | 'tired' | 'stressed'

const encouragements: Record<MoodType, string[]> = {
  great: [
    "대단해요! 오늘도 훌륭한 학습을 완료했네요! 🎉",
    "최고예요! 이 기세라면 합격은 따놓은 당상! 💪",
    "오늘도 성공적인 하루! 자신감을 가지세요! ✨",
    "완벽해요! 열정이 대단해요! 🔥",
    "정말 잘하고 있어요! 계속 이렇게만 하면 돼요! 🌟",
  ],
  good: [
    "좋은 하루였어요! 꾸준히 하면 목표 달성! 👍",
    "잘하고 있어요! 내일도 이 페이스 유지! 🚀",
    "오늘의 노력이 내일의 결과로! 화이팅! 💪",
    "한 걸음씩 나아가고 있어요! 멋져요! 🎯",
    "착실하게 진행 중이에요! 훌륭해요! 📚",
  ],
  okay: [
    "괜찮아요! 하루하루가 쌓이면 큰 산도 넘을 수 있어요! 🌟",
    "조금씩 나아가는 것도 전진이에요! 👏",
    "오늘의 작은 노력이 큰 변화를 만들어요! ✨",
    "포기하지 않는 것이 가장 중요해요! 힘내세요! 💪",
    "꾸준함이 승리의 비결이에요! 👍",
  ],
  tired: [
    "오늘은 좀 쉬어도 괜찮아요. 내일 다시 힘내세요! 💤",
    "몸과 마음도 중요해요. 충분한 휴식 후 다시! 🌙",
    "피곤한 날도 있는 법이에요. 푹 쉬세요! 😴",
    "쉬는 것도 공부의 일부예요. 재충전하세요! 🔋",
    "오늘도 공부한 당신, 정말 대단해요! 🙌",
  ],
  stressed: [
    "스트레스 받는 날도 있어요. 심호흡하고 쉬어가세요! 🍃",
    "힘든 날에도 공부한 당신, 대단해요! 🌈",
    "잠시 휴식을 취하고 다시 도전해요! 여유를 가지세요! ☕",
    "어려울 때일수록 자신을 칭찬해주세요! 💕",
    "지금 힘든 건 성장하고 있다는 증거예요! 🌱",
  ],
}

interface AIEncouragementProps {
  mood: MoodType
  onClose: () => void
}

export function AIEncouragement({ mood, onClose }: AIEncouragementProps) {
  const message = useMemo(() => {
    const messages = encouragements[mood]
    return messages[Math.floor(Math.random() * messages.length)]
  }, [mood])

  return (
    <div className="text-center py-6 px-4">
      <div className="mb-6">
        <div className="h-16 w-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold mb-2">체크인 완료!</h3>
      </div>

      <div className="bg-muted/50 rounded-xl p-6 mb-6">
        <p className="text-lg font-medium leading-relaxed">
          {message}
        </p>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        오늘의 기록이 저장되었어요. 내일도 화이팅! 🔥
      </p>

      <Button onClick={onClose} className="w-full">
        확인
      </Button>
    </div>
  )
}
