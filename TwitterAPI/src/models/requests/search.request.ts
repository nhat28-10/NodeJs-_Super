import { MediaTypeQuery } from "~/constants/enum";
import { Pagination } from "./tweets.request";

export interface SearchQuery extends Pagination {
  content: string
  media_type: MediaTypeQuery
}