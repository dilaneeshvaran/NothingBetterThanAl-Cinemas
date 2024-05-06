import { Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class SuperTicket {
    @PrimaryGeneratedColumn()
    id!: number;
  
    @Column({ default: 100 })
    price: number;

    @Column({ default: 10 })
    usesRemaining: number;

    @Column("simple-array", { nullable: true })
    usedSchedules: number[];

    constructor(
        price: number = 15,
        usesRemaining: number = 10,
        usedSchedules: number[] = []
    ) {
        this.price = price;
        this.usesRemaining = usesRemaining;
        this.usedSchedules = usedSchedules;
    }
}