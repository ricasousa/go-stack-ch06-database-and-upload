import fs from 'fs';
import csvParse from 'csv-parse';
import { In, getRepository, getCustomRepository } from 'typeorm';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';

interface TransactionCSV {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filename: string): Promise<Transaction[]> {
    const contentFileStream = fs.createReadStream(`./tmp/${filename}`);

    const contentFileParsers = csvParse({
      from_line: 2,
    });

    const contentFileParsed = contentFileStream.pipe(contentFileParsers);

    const transactionsFromImport: TransactionCSV[] = [];
    const categoriesFromImport: string[] = [];

    contentFileParsed.on('data', line => {
      const [title, type, value, categoryName] = line.map((cell: string) => {
        return cell.trim();
      });

      if (!title || !type || !value) return;

      transactionsFromImport.push({
        title,
        type,
        value,
        category: categoryName,
      });
      categoriesFromImport.push(categoryName);
    });

    await new Promise(resolve => contentFileParsed.on('end', resolve));

    const categoryRepository = getRepository(Category);

    const categoriesInDB = await categoryRepository.find({
      where: {
        title: In(categoriesFromImport),
      },
    });

    const categoriesToSave = categoriesFromImport
      .filter((category: string, index: number, self: string[]) => {
        return self.indexOf(category) === index;
      })
      .filter(
        (category: string) => !categoriesInDB.find(c => c.title === category),
      );

    const newCategories = categoryRepository.create(
      categoriesToSave.map(title => ({ title })),
    );

    await categoryRepository.save(newCategories);

    const finalCategories = [...newCategories, ...categoriesInDB];

    const transactionRepository = getCustomRepository(TransactionsRepository);
    const newTransactions = transactionRepository.create(
      transactionsFromImport.map(t => ({
        title: t.title,
        type: t.type,
        value: t.value,
        categoryId: finalCategories.find(c => c.title === t.category)?.id,
      })),
    );

    await transactionRepository.save(newTransactions);

    await fs.promises.unlink(`./tmp/${filename}`);

    return newTransactions;
  }
}

export default ImportTransactionsService;
