/* eslint-disable @typescript-eslint/no-unused-vars */
import "react";

declare module "react" {
  interface InputHTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}
