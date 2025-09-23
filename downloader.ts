
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as stream from 'stream';
import { promisify } from 'util';
import * as readline from 'readline';

console.log('Downloader module loaded');
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
})

rl.question('Enter the video URL: ', async (url) => {
	if (url.includes('bilibili') || url.includes('b23.tv')) {
		console.log('Bilibili downloader is not implemented yet.');
	}
}
)

// Bilibili downloader
