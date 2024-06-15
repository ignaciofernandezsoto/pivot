import axios from "axios";
import {ErrorResultDto, MinimalMovieDataDto, MoviesDto, MovieServiceResponseDto, MoviesPayloadDto} from "./dto"

const APIPI_MOVIES_RESOURCE = "movies"

const getAllMovies =
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

const getMovie = async (yifyId: number) => {
    const url = `${process.env.APIPI_BASE_URL!}/${APIPI_MOVIES_RESOURCE}/${yifyId}`

    const {data} = await axios
        .get<MovieServiceResponseDto<ErrorResultDto | MinimalMovieDataDto>>(
            url
        )
        .catch(e => {
            throw new Error(e)
        });

    return data;
}

export const MovieService = {
    getAllMovies,
    getMovie,
}