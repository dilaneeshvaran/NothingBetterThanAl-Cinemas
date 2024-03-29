import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,JoinColumn } from "typeorm";

@Entity()
export class Schedule {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  date: Date;

  @Column()
  movieId: number;
  
  @Column()
  auditoriumId: number;

  constructor(
    date: Date,
    movieId:number,
    auditoriumId:number,
  ) {
    this.date = date;
    this.movieId = movieId;
    this.auditoriumId = auditoriumId;
  }
}