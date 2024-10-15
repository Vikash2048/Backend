import { videoSchema } from "./video.model";
import { mongooseAggregatePaginate } from "mongoose-aggregate-paginate-v2"

//mongoose plugin
videoSchema.plugin(mongooseAggregatePaginate);