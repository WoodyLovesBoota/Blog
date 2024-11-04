import { AxiosInstance } from "axios";
import { API_URL } from "@/api/constant/eipApi.url";
import { AjaxOptions } from "../@types/common";
import axios from "@/vendor/axios";

export class EipService {
  /**
   * @description 전체 랭킹 조회
   */
  async getRanking(req: GetRankingRequest, options?: AjaxOptions) {
    const { data } = await axios.get<GetRankingResponse>(options?.url ?? API_URL.GET_RANKING(), {
      params: {
        ...req.query,
      },
    });

    return data;
  }

  /**
   * @description 번호별 정보 조회
   */
  async getDetail(req: GetDetailRequest, options?: AjaxOptions) {
    const { data } = await axios.get<GetDetailResponse>(
      options?.url ?? API_URL.GET_DETAIL(req.query),
      {
        // params: {
        //   ...req.query,
        // },
      }
    );

    return data;
  }
}
