export type RootStackParamList = {
    Login: undefined;
    Products: undefined;
    AddProduct: { refresh?: () => void };
    EditProduct: { productId: number; refresh?: () => void };
    EditStock: { productId: number; refresh?: () => void };
  };
  