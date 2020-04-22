import { Router } from 'express';

import { getCustomRepository } from 'typeorm';
import multer from 'multer';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

const upload = multer({ dest: 'tmp/' });

const transactionsRouter = Router();

transactionsRouter.get('/', async (request, response) => {
  const transactionRepository = getCustomRepository(TransactionsRepository);
  // const transactions = await transactionRepository.find();
  const transactionsFromDB = await getCustomRepository(TransactionsRepository)
    .createQueryBuilder('transaction')
    .leftJoinAndSelect(
      'transaction.category',
      'category',
      'category.id = transaction.category_id',
    )
    .getMany();

  const balance = await transactionRepository.getBalance();

  const transactions = transactionsFromDB.map(t => {
    const transaction = t;
    delete transaction.createdAt;
    delete transaction.updatedAt;
    delete transaction.categoryId;
    delete transaction.category.createdAt;
    delete transaction.category.updatedAt;

    return transaction;
  });

  response.json({ transactions, balance });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;

  const createTransaction = new CreateTransactionService();
  const transaction = await createTransaction.execute({
    title,
    value,
    type,
    categoryName: category,
  });

  response.status(201).json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;

  const deleteTransaction = new DeleteTransactionService();
  await deleteTransaction.execute(id);

  return response.status(204).send();
});

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    const importTransaction = new ImportTransactionsService();
    const transactions = await importTransaction.execute(request.file.filename);

    return response.json(transactions);
  },
);

export default transactionsRouter;
