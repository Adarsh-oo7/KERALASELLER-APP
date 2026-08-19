import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Products: undefined;
  Orders: undefined;
  Stock: undefined;
  More: undefined;
};

export type MainStackParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList>;
  ProductForm: { productId?: number; barcode?: string };
  OrderDetail: { orderId: number };
  Billing: { billId?: number; openScanner?: boolean } | undefined;
  Settings: { setup?: boolean } | undefined;
  BasicSettings: { setup?: boolean } | undefined;
  Payments: { setup?: boolean } | undefined;
  Notifications: undefined;
  History: undefined;
  Analytics: undefined;
  Subscription: { setup?: boolean } | undefined;
  Addons: undefined;
  Barcodes: undefined;
  HomepageListing: undefined;
  DeliveryCharges: undefined;
  DeleteAccount: undefined;
  Staff: undefined;
  Expenses: undefined;
  Purchases: undefined;
  Locations: undefined;
  Loyalty: undefined;
  Customers: undefined;
};

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainStackScreenProps<T extends keyof MainStackParamList> =
  NativeStackScreenProps<MainStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<MainStackParamList>
  >;
