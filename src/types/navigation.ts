export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Products: undefined;
  Orders: undefined;
  Profile: undefined;
};

export type ProductStackParamList = {
  ProductList: undefined;
  AddProduct: undefined;
  EditStock: { productId: number };
};
