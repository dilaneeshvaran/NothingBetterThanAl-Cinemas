import { Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class Ticket {
    @PrimaryGeneratedColumn()
    id!: number;
  
    @Column()
    price:number;

    @Column()
    movieId:number;

    @Column()
    scheduleId:number;

  constructor(
    price:number,
    movieId:number,
    scheduleId:number
  ) {
    this.price=price;
    this.movieId=movieId;
    this.scheduleId=scheduleId;
  }
}