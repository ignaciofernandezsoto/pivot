import axios from "axios";
import {ErrorResultDto, MoviesDto, MovieServiceResponseDto} from "./dto"

const APIPI_MOVIES_RESOURCE = "movies"
const QUERY_TERM_NAME = "q"

const getAllMovies: (query?: string) => Promise<MovieServiceResponseDto<ErrorResultDto | MoviesDto>> = async (query?: string) => {
    const url = `${process.env.APIPI_BASE_URL!}/${APIPI_MOVIES_RESOURCE}`
    const params = query ? {
        [QUERY_TERM_NAME]: query
    } : {}

    const { data } =  await axios
        .get<MovieServiceResponseDto<ErrorResultDto | MoviesDto>>(
            url,
            {
                params
            }
        )
        .catch(e => {
            throw new Error(e)
        });

    return data;
}

export const MovieService = {
    getAllMovies,
}