import {
    Entity,
    PrimaryGeneratedColumn,
    Column
} from 'typeorm';

export enum TransactionType {
    DEPOSIT = 'deposit',
    WITHDRAW = 'withdraw',
    PURCHASE = 'purchase'
}

@Entity()
export class Transaction {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        type: 'enum',
        enum: TransactionType,
        default: TransactionType.DEPOSIT
    })
    type!: TransactionType;

    @Column()
    amount!: number;

    @Column()
    userId!: number;
}