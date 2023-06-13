import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { Button, message, Upload } from 'antd';
import { useEffect, useState } from 'react';
import './Upload.css'
import Papa from 'papaparse';
import jschardet from 'jschardet';
import newRequest from '../utils/newRequest';

const CsvUpload = (param) => {
    const [fileList, setFileList] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [papaData, setPapaData] = useState('');

    const handleUpload = () => {
        const formData = new FormData();
        fileList.forEach((file) => {
            formData.append('files[]', file);
        });

        setUploading(true);
        fetch(`http://localhost:8800/api/upload`, {
            method: 'post',
            body: formData,
        })
            .then((res) => res.json())
            .then(() => {
                setFileList([]);
                console.log(formData.get('files[]'), 'formData3');
                message.success('upload successfully.');
            })
            .catch(() => {
                message.error('upload failed.');
            })
            .finally(() => {
                setUploading(false);
            });

        const batchUploadRadars = async () => {
            try {
                const values = [];
                let entriesNum = param.entries.length;
                let num = entriesNum;
                console.log(entriesNum, 'entriesNum');
                papaData.forEach(element => {
                    num++;
                    values.push([element.quadrant, element.ring, element.label, element.active, element.moved, element.desc, num, element.link]);
                });
                await newRequest.put(`/radars`, {
                    data: values
                });
            } catch (err) { }
        };
        batchUploadRadars();
        window.location.reload();
    };


    const printFile = (file) => {
        var reader = new FileReader();
        reader.onload = function (evt) {
            // const data = evt.target.result;
            console.log(evt.target.result, ' asd');
            Papa.parse(file, {
                header: true,
                complete: function (results) {
                    const res = results.data;
                    if (res[res.length - 1] === "") {
                        res.pop();
                    }
                    setPapaData(res);
                }
            });
        };
        reader.readAsText(file);
    }

    const props = {
        onRemove: (file) => {
            const index = fileList.indexOf(file);
            const newFileList = fileList.slice();
            newFileList.splice(index, 1);
            setFileList(newFileList);
        },
        beforeUpload: (file) => {
            setFileList([...fileList, file]);
            let a = printFile(file)
            let b = String(a);
            console.log(printFile(file), 'fileList');
            console.log(b, 'fileList2');
            return false;
        },
        fileList,
    };
    useEffect(() => {
        console.log(papaData);
    }, [papaData]);
    return (
        <div className='upload'>
            <Button style={{ marginRight: 16, marginTop: 16, }} icon={<DownloadOutlined />}>
                <a
                    download
                    href={require('./file.csv')}
                >Download Template</a></Button>

            <Upload {...props}>
                <Button style={{ marginRight: 16, marginTop: 16, }} icon={<UploadOutlined />}>Select File</Button>
            </Upload>

            <Button
                type="primary"
                onClick={handleUpload}
                disabled={fileList.length === 0}
                loading={uploading}
                style={{
                    marginTop: 16,
                    marginRight: 16,
                }}
            >
                {uploading ? 'Uploading' : 'Start Upload'}
            </Button>

        </div>
    );
};
export default CsvUpload;