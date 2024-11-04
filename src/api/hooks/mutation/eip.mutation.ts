import { eipService } from "@/api/services";
import { useMutation } from "@tanstack/react-query";

export function useEipMutation() {
  const getRanking = useMutation({
    mutationFn: eipService.getRanking,
    onSuccess(data) {},
    onError(error) {},
  });

  const getDetail = useMutation({
    mutationFn: eipService.getDetail,
    onSuccess(data) {},
    onError(error) {},
  });

  return {
    getRanking,
    getDetail,
  };
}
