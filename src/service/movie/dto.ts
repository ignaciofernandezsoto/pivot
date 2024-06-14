export interface MoviesDto {
    movies: MovieDto[]
}

export interface MovieDto {
    yifyId: number,
    title: string,
    description: string,
    displayImageUrl: string
    year: number,
    rating: number,
    torrentHash: string
    hasSubs: boolean
}

export interface ErrorResultDto {
    message: string
}

export interface MovieServiceResponseDto<T> {
    success: boolean,
    data: T
}