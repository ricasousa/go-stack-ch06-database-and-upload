import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface RequestDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  categoryName: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    categoryName,
  }: RequestDTO): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);
    const balance = await transactionRepository.getBalance();

    if (type === 'outcome') {
      if (value > balance.total) {
        throw new AppError('Insufficient balance');
      }
    }

    let category = await categoryRepository.findOne({
      where: { title: categoryName },
    });

    if (!category) {
      category = categoryRepository.create({
        title: categoryName,
      });

      await categoryRepository.save(category);
    }

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      categoryId: category.id,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
