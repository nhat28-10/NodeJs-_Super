import { Pagination } from "./tweets.request";

export interface SearchQuery extends Pagination {
  content: string
}