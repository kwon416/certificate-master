import Link from 'next/link'
import { GraduationCap, Github, Mail } from 'lucide-react'

const footerLinks = {
  product: [
    { label: '자격증 검색', href: '/search' },
  ],
  community: [
    { label: '커뮤니티', href: '/community' },
  ],
  legal: [
    { label: '이용약관', href: '/terms' },
    { label: '개인정보처리방침', href: '/privacy' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-slate-800/50 bg-slate-950">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500">
                <GraduationCap className="h-5 w-5 text-slate-900" />
              </div>
              <span className="font-bold text-lg text-white">
                자격증 마스터
              </span>
            </Link>
            <p className="mt-4 text-sm text-slate-500 leading-relaxed">
              나에게 맞는 자격증 찾기
              <br />
              흩어진 자격증 정보를 한 화면에 모아
              <br />
              시험 정보 · 공부 방법 · 후기 기준으로 정리했어요.
              <br />
              현재는 자격증 검색 기능만 제공 중입니다.
            </p>
            <div className="mt-4 flex gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-emerald-400 transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="mailto:contact@certmaster.kr"
                className="text-slate-500 hover:text-emerald-400 transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">서비스</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 hover:text-emerald-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">커뮤니티</h3>
            <ul className="space-y-3">
              {footerLinks.community.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 hover:text-emerald-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">법적 고지</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 hover:text-emerald-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/50">
          <p className="text-center text-sm text-slate-600">
            © {new Date().getFullYear()} 자격증 마스터. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

