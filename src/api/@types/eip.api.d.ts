/**
 * @method GET
 * @path /eip/v1/rank
 * @summary 전체 랭킹 조회
 */

declare type GetRankingRequestQuery = {
  /** 현재 페이지 */
  page: number;
  /** 한 페이지에 몇개 */
  limit: number;
  /** 정렬 */
  sort: string;
};
declare type GetRankingResponseBody = {
  data: {
    eipNumber: number;
    title: string;
    description: string;
    activityScore: number;
    proposalType: string;
  }[];
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
};
/** 요청 타입 */
declare type GetRankingRequest = {
  query?: Partial<GetRankingResquestQuery>;
};
/** 응답 타입 */
declare type GetRankingResponse = GetRankingResponseBody;

/**
 * @method GET
 * @path /eip/v1
 * @summary 번호별 정보 조회
 */

declare type GetDetailRequestQuery = {};
declare type GetDetailResponseBody = {
  number: number;
  rank?: number;
  title: string;
  description: string;
  authors?: string[];
  proposalType: string;
  updatedAt: string;
  discussionsTo?: {
    eth_magicians: string;
    telegram: string;
    discord: string;
    twitter: string;
  };
  status?: string;
  type?: string;
  created?: string;
  category?: string;
  requires?: number[];
  activityScore: {
    all: number; // ethereum magicians 없는 경우 0
    daily: number;
    weekly: number;
  };
  activities: {
    ethereumMagicians?: {
      lastPost: string;
      posts: number;
      likes: number;
    };
    telegram?: { messages: number; activeUsers: number }; // 구체적인 타입이 명시되지 않음
    discord?: any[]; // 구체적인 타입이 명시되지 않음
    twitter?: any[]; // 구체적인 타입이 명시되지 않음
  };
};

/** 요청 타입 */
declare type GetDetailRequest = {
  query?: Partial<GetDetailResquestQuery>;
};
/** 응답 타입 */
declare type GetDetailResponse = GetDetailResponseBody;
