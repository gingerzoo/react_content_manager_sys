interface IOption {
    label: string;
    value: string;
}

interface IHeader {
    title: string;
    btnTitle: string;
}

interface IFormItem {
    type: string;
    label: string;
    name: string;
    placeholder?: string;
    initialValue?: string;
    options?: IOption[];
}

interface ITableItem {
    title: string;
    dataIndex?: string;
    key?: string;
    width?: string;
    align?: string;
    render?: (any, any) => any;
}

export interface ISearchConfig {
    pageName: string;
    formItems: IFormItem[];
}

export interface IContentConfig {
    pageName: string;
    header?: IHeader;
    tableItems: ITableItem[];
}

export interface IModalConfig {
    pageName: string;
    headerName: string;
    modalItems: IFormItem[];
}
