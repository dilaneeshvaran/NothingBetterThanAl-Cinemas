import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Auditorium } from "./auditorium";
import { Movie } from "./movie";
import { Ticket } from "./ticket";

@Entity()
export class Schedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  date: Date;

  @Column()
  duration:number;

  @ManyToOne(() => Movie, (movie) => movie.schedules)
  movie: Movie;

  @ManyToOne(() => Auditorium, (auditorium) => auditorium.id)
  auditorium: Auditorium;

  @OneToMany(() => Ticket, (ticket) => ticket.schedule)
  tickets: Ticket[];

  constructor(
    id:number,
    date: Date,
    duration:number,
    movie: Movie,
    auditorium: Auditorium,
    tickets:Ticket[],
  ) {
    this.id=id;
    this.date = date;
    this.duration=duration;
    this.movie = movie;
    this.auditorium = auditorium;
    this.tickets=tickets;
  }
}