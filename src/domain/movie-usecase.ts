import { DataSource, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { Movie } from "../database/entities/movie";

export interface ListMovie {
    limit: number;
    page: number;
  }

  export interface UpdateMovieParams {
    id:number;
    description?: string;
    imageUrl?: string;
    duration?:number
  }

export class MovieUsecase {
    constructor(private readonly db: DataSource) {}

    async listMovie(
        listMovie: ListMovie
      ): Promise<{ movies: Movie[]; totalCount: number }> {
        const query = this.db.createQueryBuilder(Movie, "movies");
        
        query.skip((listMovie.page - 1) * listMovie.limit);
        query.take(listMovie.limit);
    
        const [movies, totalCount] = await query.getManyAndCount();
        return {
            movies,
          totalCount,
        };
      }
      async getMovieById(movieId: number): Promise<Movie> {
        const query = this.db.createQueryBuilder(Movie, "movies");
      
        query.where("movies.id = :id", { id: movieId });
      
        const movie = await query.getOne();
      
        if (!movie) {
          throw new Error('Movie not found');
        }
      
        return movie;
      }

      async updateMovie(
        id: number,
        { description,imageUrl, duration }: UpdateMovieParams
      ): Promise<Movie | null> {
        const repo = this.db.getRepository(Movie);
        const movieFound = await repo.findOneBy({ id });
        if (movieFound === null) return null;
      
        if (description) {
          movieFound.description = description;
        }        
        if (imageUrl) {
          movieFound.imageUrl = imageUrl;
        }

        if (duration) {
          movieFound.duration = duration;
        }

        const movieUpdate = await repo.save(movieFound);
        return movieUpdate;
      }

      async deleteMovie(id: number): Promise<Movie | null> {
        const repo = this.db.getRepository(Movie);
        const movieFound = await repo.findOneBy({ id });
      
        if (!movieFound) return null;
      
        await repo.remove(movieFound);
        return movieFound;
      }
/*

      async getScheduleBetween(startDate: string, endDate: string): Promise<Schedule[]> {
        const query = this.db.createQueryBuilder(Schedule, "schedules");
    
        query.where("schedules.date >= :startDate AND schedules.date <= :endDate", { startDate, endDate });
    
        const schedules = await query.getMany();
    
        if (!schedules || schedules.length === 0) {
            throw new Error('No schedules found between the specified dates');
        }
    
        return schedules;
    }



async doesOverlap(schedule: Schedule): Promise<boolean> {
    const repo = this.db.getRepository(Schedule);

    // calculate end time, duration here is in minutes
    const endTime = new Date(schedule.date.getTime() + schedule.duration * 60000);
  
    // check for overlap
    const overlappingSchedules = await repo.find({
      where: [
        {
          movieId: schedule.movieId,
          auditoriumId: schedule.auditoriumId,
          date: LessThanOrEqual(endTime),
        },
        {
          movieId: schedule.movieId,
          auditoriumId: schedule.auditoriumId,
          date: MoreThanOrEqual(schedule.date),
        }
      ]
    });
  
    return overlappingSchedules.length > 0;
  }

*/
}
