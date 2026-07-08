import { useReactToPrint } from 'react-to-print';

/**
 * usePrint - Hook dùng chung để in tài liệu thông qua ref
 *
 * @param {React.RefObject} componentRef - Ref trỏ đến phần tử cần in
 * @returns {Function} handlePrint - Hàm kích hoạt hộp thoại in
 */
export default function usePrint(componentRef) {
  return useReactToPrint({
    contentRef: componentRef,
    content: () => componentRef.current,
  });
}
