import { API_BASE_URL } from "@/constants/api.constant";
import axios from "axios";
import qs from "qs";

axios.defaults.baseURL = API_BASE_URL;
axios.defaults.timeout = 180000;
axios.defaults.headers.common["Content-Type"] = "application/json";

axios.defaults.paramsSerializer = (params) => {
  const str = qs.stringify(params, { arrayFormat: "brackets" });

  return qs.stringify(params, { arrayFormat: "comma" });
};

export default axios;
