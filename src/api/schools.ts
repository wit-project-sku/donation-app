import { apiGet } from "./client";
import type {
  PaginatedData,
  SchoolDto,
  SchoolListParams,
} from "./types";

const SCHOOLS_PATH = "/api/donations/schools";

export async function fetchSchoolsPage(
  params: SchoolListParams = {},
): Promise<PaginatedData<SchoolDto>> {
  const pageNum = params.pageNum ?? 1;
  const pageSize = params.pageSize ?? 10;

  // `apiGet` typing only accepts string/number query params.
  // Pass booleans as explicit "true"/"false" strings.
  const includeInactive = String(params.includeInactive ?? false);

  return apiGet<PaginatedData<SchoolDto>>(SCHOOLS_PATH, {
    pageNum,
    pageSize,
    ...(params.region ? { region: params.region } : {}),
    ...(params.initial ? { initial: params.initial } : {}),
    ...(params.keyword ? { keyword: params.keyword } : {}),
    ...(params.sort ? { sort: params.sort } : {}),
    includeInactive,
  });
}

export async function fetchSchoolById(
  id: string | number,
): Promise<SchoolDto> {
  return apiGet<SchoolDto>(`${SCHOOLS_PATH}/${id}`);
}

export type { SchoolDto, SchoolListParams };

