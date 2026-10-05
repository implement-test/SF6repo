import { lazy, type ComponentType } from "react";

const FLAG = "sf6r:chunk-reload";

/**
 * 관리자 창을 처음 열 때 불러오는 lazy 컴포넌트.
 * 새 버전이 배포되면 예전 파일이 지워져서, 배포 전에 열어 둔 페이지에서는 창 파일을 못 찾는다.
 * 그때는 한 번만 페이지를 새로 고쳐 새 버전을 받는다 (계속 실패하면 오류를 그대로 보여 준다).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- React.lazy 와 같은 제약
export function lazyWithReload<T extends ComponentType<any>>(load: () => Promise<{ default: T }>) {
  return lazy(() =>
    load().then(
      (mod) => {
        try {
          sessionStorage.removeItem(FLAG);
        } catch {}
        return mod;
      },
      (error) => {
        let reloaded = false;
        try {
          reloaded = sessionStorage.getItem(FLAG) === "1";
          if (!reloaded) sessionStorage.setItem(FLAG, "1");
        } catch {}
        if (reloaded) throw error;
        location.reload();
        return new Promise<never>(() => {});
      },
    ),
  );
}
