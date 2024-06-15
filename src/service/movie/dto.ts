export interface MoviesPayloadDto {
    q?: string,
    limit?: number,
    page?: number
}

export interface MoviesDto {
    movies: MovieDto[],
    total: number,
    limit: number,
    page: number,
}

export interface MovieDto extends MinimalMovieDataDto {
    description: string,
    displayImageUrl: string,
    year: number,
    rating: number,
    hasSubs: boolean,
}

export interface MinimalMovieDataDto {
    yifyId: number,
    imdbId: string,
    title: string,
    torrentHash: string,
}

export interface ErrorResultDto {
    message: string
}

export interface MovieServiceResponseDto<T> {
    success: boolean,
    data: T
}