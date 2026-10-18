export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiResponseWithPagination<T> {
    success: boolean;
    message: string;
    data: {
        items: T[];
        pagination: Pagination;
    };
}
export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}