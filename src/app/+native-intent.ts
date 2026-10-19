/** 카카오 SDK의 인증 콜백은 화면 주소가 아니다. 이후 이동은 서버 인증 결과에 맡긴다. */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string | null {
  try {
    const url = new URL(path);
    if (url.protocol === 'baton:' && url.hostname === 'workspace' && url.pathname === '/join') {
      const token = url.searchParams.get('token');
      return token && /^[A-Za-z0-9_-]+$/.test(token)
        ? `/workspace/join?token=${encodeURIComponent(token)}`
        : '/workspace/join';
    }
    if (/^kakao[0-9a-f]+:$/i.test(url.protocol) && url.hostname === 'oauth') {
      // Expo의 Scene 처리에서 SDK가 받은 URL도 Linking으로 전달된다.
      // 초기 URL과 실행 중 URL 모두 무시해 로그인/가입 화면을 가로채지 않게 한다.
      return null;
    }
  } catch {
    // 외부 입력은 URL이 아닌 앱 경로일 수도 있다. 기존 라우터 처리를 유지한다.
  }

  return path;
}
