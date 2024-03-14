import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// tsconfig set { "module": "NodeNext", "moduleResolution": "NodeNext" }
import { createFile } from '@compass-aiden/helpers'; // auto import cjs
// import * as Helpers from '@compass-aiden/helpers'; // import all
// import { createFile } from '@compass-aiden/helpers/cjs'; // import cjs
// const { createFile } = require('@compass-aiden/helpers'); // auto import cjs

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
  console.log('Test: ', typeof createFile);
  // console.log('Test: ', typeof Helpers.createFile);
}
bootstrap();
