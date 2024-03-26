import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Auditorium } from "./auditorium";
import { Schedule } from "./schedule";

@Entity()
export class Movie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  title: string;

  @Column()
  description: string;

  @Column()
  imageUrl: string;

  @OneToMany(() => Schedule, (schedule) => schedule.movie)
  schedules: Schedule[];


  constructor(
    id:number,
    title: string,
    description: string,
    imageUrl: string,
    schedules: Schedule[]
  ) {
    this.id=id;
    this.title = title;
    this.description = description;
    this.imageUrl = imageUrl;
    this.schedules = schedules;
  }
}