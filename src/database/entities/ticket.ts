import { Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class Ticket {
    @PrimaryGeneratedColumn()
    id!: number;
  
    @Column({ default: 15 })
    price: number;

    @Column()
    scheduleId: number;

    @Column()
    used: boolean = false;

    constructor(
        price: number = 15,
        scheduleId: number
    ) {
        this.price = price;
        this.scheduleId = scheduleId;
    }
}