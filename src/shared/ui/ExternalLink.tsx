import { Link, type Href } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import type { ComponentProps } from 'react';

type ExternalLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & { href: Href & string };

/**
 * 외부 URL을 인앱 브라우저로 연다. 앱 밖으로 튕겨나가지 않게 항상 이걸 쓴다.
 */
export function ExternalLink({ href, ...rest }: ExternalLinkProps) {
  return (
    <Link
      accessibilityRole="link"
      {...rest}
      href={href}
      onPress={async (event) => {
        event.preventDefault();
        await openBrowserAsync(href, {
          presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
        });
      }}
    />
  );
}
