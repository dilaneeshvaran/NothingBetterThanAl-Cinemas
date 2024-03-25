import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Auditorium } from "./auditorium";
import { Movie } from "./movie";
import { Ticket } from "./ticket";

@Entity()
export class Schedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  showTime: Date;

  @ManyToOne(() => Movie, (movie) => movie.schedules)
  movie: Movie;

  @ManyToOne(() => Auditorium, (auditorium) => auditorium.id)
  auditorium: Auditorium;

  @OneToMany(() => Ticket, (ticket) => ticket.schedule)
  tickets: Ticket[];

  constructor(
    id:number,
    showTime: Date,
    movie: Movie,
    auditorium: Auditorium,
    tickets:Ticket[],
  ) {
    this.id=id;
    this.showTime = showTime;
    this.movie = movie;
    this.auditorium = auditorium;
    this.tickets=tickets;
  }
}