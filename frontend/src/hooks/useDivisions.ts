import { useQuery } from "@tanstack/react-query"

import { DivisionsService } from "@/client"

export const useDivisions = () =>
  useQuery({
    queryKey: ["divisions"],
    queryFn: () => DivisionsService.listDivisions(),
  })

export const useDivisionGroups = (divisionId?: string) =>
  useQuery({
    queryKey: ["division-groups", divisionId],
    queryFn: () =>
      DivisionsService.listDivisionGroups({ divisionId: divisionId as string }),
    enabled: Boolean(divisionId),
  })
