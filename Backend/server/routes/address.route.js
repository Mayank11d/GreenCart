import express from 'express';
import { isAuth } from '../middlewares/isAuth.js';
import { addAddress, getAddress } from '../controllers/address.controller.js';

const addressRouter =express.Router();

addressRouter.post('/add',isAuth,addAddress);
addressRouter.get('/get',isAuth,getAddress);

export default addressRouter;