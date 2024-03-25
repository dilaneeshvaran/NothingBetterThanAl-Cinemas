import { Entity, PrimaryGeneratedColumn, Column,ManyToOne } from "typeorm";
import { Auditorium } from "./auditorium";


@Entity()
export class Image {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column()
  path: string;

  //@ManyToOne(() => Auditorium, (auditorium) => auditorium.images)
  auditorium: Auditorium;

  constructor(
    id:number,
    path: string,
    filename: string,
    auditorium:Auditorium
  ) {
    this.id = id;
    this.path = path;
    this.filename = filename;
    this.auditorium=auditorium;
  }
}