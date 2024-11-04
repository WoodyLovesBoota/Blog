export const API_URL = {
  /** 전체 랭킹 조회 */
  GET_RANKING: (_: IfEmpty<{}>) => "/eip/v1/rank",
  /** 번호별 정보 조회 */
  GET_DETAIL: (num: number) => `/eip/v1/${num}`,
};
