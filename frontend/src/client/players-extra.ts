import { OpenAPI } from "./core/OpenAPI"
import { request as __request } from "./core/request"

type PaginatedResponse<T> = {
  data?: T[]
}

export type Division = {
  id: string
  name: string
  description?: string | null
}

export type DivisionGroup = {
  id: string
  name: string
  division_id: string
}

const normalize = <T extends { id: string }>(payload: PaginatedResponse<T> | T[]) => {
  if (Array.isArray(payload)) {
    return payload
  }

  if (payload?.data && Array.isArray(payload.data)) {
    return payload.data
  }

  return []
}

export class DivisionsService {
  static listDivisions(): Promise<Division[]> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/divisions/",
    }).then((payload) => normalize<Division>(payload as PaginatedResponse<Division> | Division[]))
  }
}

export class DivisionGroupsService {
  static listDivisionGroups({
    divisionId,
  }: { divisionId?: string | null } = {}): Promise<DivisionGroup[]> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/division-groups/",
      query: divisionId ? { division_id: divisionId } : undefined,
    }).then((payload) =>
      normalize<DivisionGroup>(payload as PaginatedResponse<DivisionGroup> | DivisionGroup[]),
    )
  }
}
