import { request as umiRequest } from '@umijs/max';

/**
 * Umi request 默认已按 dataField（一般为 data）解出后端 {@code ResponseData.data}。
 * 若再取 .data，会把 NoteDTO、Page 等当成「外层包」而得到 undefined。
 * 仅当返回值仍带 success + data（完整 ResponseData）时再取一层 data。
 */
function pickResultBody(resp: any): any {
  if (resp == null) return resp;
  if (typeof resp !== 'object') return resp;
  if (
    Object.prototype.hasOwnProperty.call(resp, 'success') &&
    Object.prototype.hasOwnProperty.call(resp, 'data')
  ) {
    return resp.data;
  }
  return resp;
}

export async function request<T>(
  url: string,
  options: any = { method: 'GET' },
): Promise<T | undefined> {
  if (!options['throwError']) {
    try {
      const resp: any = await umiRequest(url, options);
      return pickResultBody(resp) as T | undefined;
    } catch (ex) {
      return undefined;
    }
  }
  const resp: any = await umiRequest(url, options);
  return pickResultBody(resp) as T | undefined;
}

export function convertPageData(result: any) {
  return {
    data: result?.list || [],
    total: result?.total || 0,
    success: true,
  };
}
export function orderBy(sort: any) {
  if (!sort) return;
  const keys = Object.keys(sort);
  if (keys.length !== 1) return;
  return keys[0] + ' ' + sort[keys[0]];
}

export async function waitTime(time: number = 100) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
}
