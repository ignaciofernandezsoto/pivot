import axios from "axios";
import {ErrorResultDto, MoviesDto, MovieServiceResponseDto, MoviesPayloadDto} from "./dto"

const APIPI_MOVIES_RESOURCE = "movies"

const getAllMovies:
    (query?: string, limit?: number, page?: number)
        => Promise<MovieServiceResponseDto<ErrorResultDto | MoviesDto>> =
    async (query?: string, limit?: number, page?: number) => {
        const url = `${process.env.APIPI_BASE_URL!}/${APIPI_MOVIES_RESOURCE}`

        const params: MoviesPayloadDto = {}

        if (query)
            params["q"] = query

        if (limit)
            params["limit"] = limit

        if (page)
            params["page"] = page

        const {data} = await axios
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