import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Schedule } from "./schedule";

@Entity()
export class Movie {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  title: string;

  @Column()
  description: string;

  @Column()
  imageUrl: string;

  @Column()
  duration:number;

  constructor(
    title: string,
    description: string,
    imageUrl: string,
    duration:number
  ) {
    this.title = title;
    this.description = description;
    this.imageUrl = imageUrl;
    this.duration=duration;
  }
}